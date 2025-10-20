import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertFileSchema, insertTerminalSessionSchema, insertSecretSchema, insertWorkflowSchema, insertAgentTaskSchema, insertConsoleLogSchema } from "@shared/schema";
import { generateCode, analyzeCode, fixBug, generateFileStructure } from "./gemini";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function registerRoutes(app: Express): Promise<Server> {
  // Get or create default project
  app.get("/api/projects/current", async (req, res) => {
    try {
      let project = await storage.getCurrentProject();
      if (!project) {
        project = await storage.createProject({
          name: "AI Agent Workspace",
          description: "Autonomous development environment",
        });
      }
      res.json(project);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // File operations
  app.get("/api/files", async (req, res) => {
    try {
      const project = await storage.getCurrentProject();
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      const files = await storage.getAllFiles(project.id);
      res.json(files);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/files", async (req, res) => {
    try {
      const data = insertFileSchema.parse(req.body);
      const file = await storage.createFile(data);

      // Log AI action
      await storage.createConsoleLog({
        projectId: data.projectId,
        level: "info",
        message: `Created file: ${file.path}`,
      });

      // Broadcast to all clients
      if ((req.app as any).broadcast) {
        (req.app as any).broadcast({ type: "file_updated", data: file });
      }

      res.json(file);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/files/:id", async (req, res) => {
    try {
      const { content } = req.body;
      const file = await storage.updateFile(req.params.id, content);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      // Log AI action
      const project = await storage.getCurrentProject();
      if (project) {
        await storage.createConsoleLog({
          projectId: project.id,
          level: "info",
          message: `Updated file: ${file.path}`,
        });
      }

      // Broadcast to all clients
      if ((req.app as any).broadcast) {
        (req.app as any).broadcast({ type: "file_updated", data: file });
      }

      res.json(file);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/files/:id", async (req, res) => {
    try {
      const file = await storage.getFile(req.params.id);
      await storage.deleteFile(req.params.id);

      // Log AI action
      if (file) {
        const project = await storage.getCurrentProject();
        if (project) {
          await storage.createConsoleLog({
            projectId: project.id,
            level: "warning",
            message: `Deleted file: ${file.path}`,
          });
        }
      }

      // Broadcast to all clients
      if ((req.app as any).broadcast) {
        (req.app as any).broadcast({ type: "file_updated", data: { id: req.params.id, deleted: true } });
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Terminal operations
  app.get("/api/terminals", async (req, res) => {
    try {
      const project = await storage.getCurrentProject();
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      let sessions = await storage.getAllTerminalSessions(project.id);

      // Create default terminal if none exists
      if (sessions.length === 0) {
        const session = await storage.createTerminalSession({
          projectId: project.id,
          name: "Terminal 1",
          history: [],
        });
        sessions = [session];
      }

      res.json(sessions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/terminals", async (req, res) => {
    try {
      const data = insertTerminalSessionSchema.parse(req.body);
      const session = await storage.createTerminalSession(data);
      res.json(session);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/terminals/:id/execute", async (req, res) => {
    try {
      const { command } = req.body;
      const session = await storage.getTerminalSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Terminal session not found" });
      }

      // Execute command with proper working directory
      let output = "";
      let exitCode = 0;

      try {
        // Execute command in the project directory
        const result = await execAsync(command, {
          cwd: process.cwd(),
          timeout: 30000,
          maxBuffer: 1024 * 1024 * 10,
          shell: '/bin/bash',
          env: { ...process.env, FORCE_COLOR: '0' },
          encoding: 'utf-8'
        });
        
        // Get output - result has stdout and stderr properties
        const stdout = String(result.stdout || '');
        const stderr = String(result.stderr || '');
        output = stdout + stderr;
        
        if (!output.trim()) {
          output = 'Command executed successfully';
        }
      } catch (execError: any) {
        // If command fails, capture the error output
        const stdout = String(execError.stdout || '');
        const stderr = String(execError.stderr || '');
        output = stdout + stderr;
        
        if (!output.trim()) {
          output = execError.message || 'Command failed';
        }
        exitCode = typeof execError.code === 'number' ? execError.code : 1;
      }

      const history = session.history || [];
      history.push({
        command,
        output: output.trim(),
        timestamp: new Date().toISOString(),
        exitCode,
      });

      const updatedSession = await storage.updateTerminalHistory(req.params.id, history);

      // Log AI action
      const project = await storage.getCurrentProject();
      if (project) {
        await storage.createConsoleLog({
          projectId: project.id,
          level: exitCode === 0 ? "success" : "error",
          message: `Executed command: ${command}`,
        });
      }

      // Broadcast to all clients
      if ((req.app as any).broadcast) {
        (req.app as any).broadcast({ type: "terminal_output", data: updatedSession });
      }

      res.json(updatedSession);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/terminals/:id", async (req, res) => {
    try {
      const session = await storage.getTerminalSession(req.params.id);
      await storage.deleteTerminalSession(req.params.id);

      // Log AI action
      if (session) {
        const project = await storage.getCurrentProject();
        if (project) {
          await storage.createConsoleLog({
            projectId: project.id,
            level: "info",
            message: `Closed terminal: ${session.name}`,
          });
        }
      }

      // Broadcast to all clients
      if ((req.app as any).broadcast) {
        (req.app as any).broadcast({ type: "terminal_updated", data: { id: req.params.id, deleted: true } });
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Database operations
  app.get("/api/database/schemas", async (req, res) => {
    try {
      const project = await storage.getCurrentProject();
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      const schemas = await storage.getAllDbSchemas(project.id);
      res.json(schemas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Secrets operations
  app.get("/api/secrets", async (req, res) => {
    try {
      const project = await storage.getCurrentProject();
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      const secrets = await storage.getAllSecrets(project.id);
      res.json(secrets);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/secrets", async (req, res) => {
    try {
      const data = insertSecretSchema.parse(req.body);
      const secret = await storage.createSecret(data);

      // Log AI action
      await storage.createConsoleLog({
        projectId: data.projectId,
        level: "info",
        message: `Added secret: ${secret.key}`,
      });

      // Broadcast to all clients
      if ((req.app as any).broadcast) {
        (req.app as any).broadcast({ type: "secret_updated" });
      }

      res.json(secret);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/secrets/:id", async (req, res) => {
    try {
      await storage.deleteSecret(req.params.id);

      // Broadcast to all clients
      if ((req.app as any).broadcast) {
        (req.app as any).broadcast({ type: "secret_updated" });
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Workflow operations
  app.get("/api/workflows", async (req, res) => {
    try {
      const project = await storage.getCurrentProject();
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      const workflows = await storage.getAllWorkflows(project.id);
      res.json(workflows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workflows", async (req, res) => {
    try {
      const data = insertWorkflowSchema.parse(req.body);
      const workflow = await storage.createWorkflow({
        ...data,
        steps: [],
        status: "pending",
      });

      // Log AI action
      await storage.createConsoleLog({
        projectId: data.projectId,
        level: "info",
        message: `Created workflow: ${workflow.name}`,
      });

      // Broadcast to all clients
      if ((req.app as any).broadcast) {
        (req.app as any).broadcast({ type: "workflow_updated", data: workflow });
      }

      res.json(workflow);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/workflows/:id/start", async (req, res) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }

      // Update workflow status
      const updated = await storage.updateWorkflow(req.params.id, {
        status: "running",
      });

      // Create AI task for the workflow
      const task = await storage.createAgentTask({
        projectId: workflow.projectId,
        workflowId: workflow.id,
        type: "workflow_execution",
        description: workflow.description || workflow.name,
        input: { workflowId: workflow.id },
        status: "running",
        startedAt: new Date(),
      });

      // Log AI action
      await storage.createConsoleLog({
        projectId: workflow.projectId,
        level: "success",
        message: `Started workflow: ${workflow.name}`,
      });

      // Broadcast to all clients
      if ((req.app as any).broadcast) {
        (req.app as any).broadcast({ type: "workflow_updated", data: updated });
        (req.app as any).broadcast({ type: "task_updated", data: task });
        (req.app as any).broadcast({ type: "log_created" });
      }

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Agent operations
  app.get("/api/agent/current-task", async (req, res) => {
    try {
      const project = await storage.getCurrentProject();
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      const task = await storage.getCurrentAgentTask(project.id);
      res.json(task || null);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/agent/generate-code", async (req, res) => {
    try {
      const { prompt, context, language } = req.body;
      const project = await storage.getCurrentProject();
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Create task
      const task = await storage.createAgentTask({
        projectId: project.id,
        type: "code_generation",
        description: `Generate code: ${prompt}`,
        input: { prompt, context, language },
        status: "running",
        startedAt: new Date(),
      });

      // Log start
      await storage.createConsoleLog({
        projectId: project.id,
        taskId: task.id,
        level: "info",
        message: `Starting code generation: ${prompt}`,
      });

      // Generate code
      const code = await generateCode({ prompt, context, language });

      // Update task
      await storage.updateAgentTask(task.id, {
        status: "completed",
        output: { code },
        completedAt: new Date(),
      });

      // Log completion
      await storage.createConsoleLog({
        projectId: project.id,
        taskId: task.id,
        level: "success",
        message: `Code generation completed`,
      });

      // Broadcast to all clients
      if ((req.app as any).broadcast) {
        (req.app as any).broadcast({ type: "task_updated", data: task });
        (req.app as any).broadcast({ type: "log_created" });
      }

      res.json({ code, taskId: task.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/agent/analyze-code", async (req, res) => {
    try {
      const { code, language } = req.body;
      const project = await storage.getCurrentProject();
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const task = await storage.createAgentTask({
        projectId: project.id,
        type: "code_analysis",
        description: "Analyzing code for issues and improvements",
        input: { code, language },
        status: "running",
        startedAt: new Date(),
      });

      await storage.createConsoleLog({
        projectId: project.id,
        taskId: task.id,
        level: "info",
        message: "Analyzing code...",
      });

      const analysis = await analyzeCode(code, language);

      await storage.updateAgentTask(task.id, {
        status: "completed",
        output: analysis,
        completedAt: new Date(),
      });

      await storage.createConsoleLog({
        projectId: project.id,
        taskId: task.id,
        level: "success",
        message: `Found ${analysis.issues.length} issues`,
      });

      // Broadcast to all clients
      if ((req.app as any).broadcast) {
        (req.app as any).broadcast({ type: "task_updated", data: task });
        (req.app as any).broadcast({ type: "log_created" });
      }

      res.json({ analysis, taskId: task.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Console logs
  app.get("/api/logs", async (req, res) => {
    try {
      const project = await storage.getCurrentProject();
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      const logs = await storage.getAllConsoleLogs(project.id);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  // Referenced from javascript_websocket blueprint
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  // Broadcast function for real-time updates
  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // Store broadcast function on app for use in routes
  (app as any).broadcast = broadcast;

  wss.on("connection", (ws: WebSocket) => {
    console.log("WebSocket client connected");

    ws.on("message", async (message: string) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });

    // Send initial connection message
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "connected", message: "AI Agent WebSocket connected" }));
    }
  });

  return httpServer;
}
