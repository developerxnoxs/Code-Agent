// Referenced from javascript_database blueprint
import {
  projects,
  files,
  terminalSessions,
  dbSchemas,
  secrets,
  workflows,
  agentTasks,
  consoleLogs,
  type Project,
  type InsertProject,
  type File,
  type InsertFile,
  type TerminalSession,
  type InsertTerminalSession,
  type DbSchema,
  type InsertDbSchema,
  type Secret,
  type InsertSecret,
  type Workflow,
  type InsertWorkflow,
  type AgentTask,
  type InsertAgentTask,
  type ConsoleLog,
  type InsertConsoleLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Projects
  getProject(id: string): Promise<Project | undefined>;
  getCurrentProject(): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;

  // Files
  getAllFiles(projectId: string): Promise<File[]>;
  getFile(id: string): Promise<File | undefined>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: string, content: string): Promise<File | undefined>;
  deleteFile(id: string): Promise<void>;

  // Terminal Sessions
  getAllTerminalSessions(projectId: string): Promise<TerminalSession[]>;
  getTerminalSession(id: string): Promise<TerminalSession | undefined>;
  createTerminalSession(session: InsertTerminalSession): Promise<TerminalSession>;
  updateTerminalHistory(id: string, history: any[]): Promise<TerminalSession | undefined>;
  deleteTerminalSession(id: string): Promise<void>;

  // Database Schemas
  getAllDbSchemas(projectId: string): Promise<DbSchema[]>;
  createDbSchema(schema: InsertDbSchema): Promise<DbSchema>;
  deleteDbSchema(id: string): Promise<void>;

  // Secrets
  getAllSecrets(projectId: string): Promise<Secret[]>;
  createSecret(secret: InsertSecret): Promise<Secret>;
  deleteSecret(id: string): Promise<void>;

  // Workflows
  getAllWorkflows(projectId: string): Promise<Workflow[]>;
  getWorkflow(id: string): Promise<Workflow | undefined>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: string, data: Partial<Workflow>): Promise<Workflow | undefined>;
  deleteWorkflow(id: string): Promise<void>;

  // Agent Tasks
  getAllAgentTasks(projectId: string): Promise<AgentTask[]>;
  getCurrentAgentTask(projectId: string): Promise<AgentTask | undefined>;
  createAgentTask(task: InsertAgentTask): Promise<AgentTask>;
  updateAgentTask(id: string, data: Partial<AgentTask>): Promise<AgentTask | undefined>;

  // Console Logs
  getAllConsoleLogs(projectId: string): Promise<ConsoleLog[]>;
  createConsoleLog(log: InsertConsoleLog): Promise<ConsoleLog>;
}

export class DatabaseStorage implements IStorage {
  // Projects
  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async getCurrentProject(): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).limit(1);
    return project || undefined;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(insertProject).returning();
    return project;
  }

  // Files
  async getAllFiles(projectId: string): Promise<File[]> {
    return await db.select().from(files).where(eq(files.projectId, projectId));
  }

  async getFile(id: string): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file || undefined;
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const [file] = await db.insert(files).values(insertFile).returning();
    return file;
  }

  async updateFile(id: string, content: string): Promise<File | undefined> {
    const [file] = await db
      .update(files)
      .set({ content, updatedAt: new Date() })
      .where(eq(files.id, id))
      .returning();
    return file || undefined;
  }

  async deleteFile(id: string): Promise<void> {
    await db.delete(files).where(eq(files.id, id));
  }

  // Terminal Sessions
  async getAllTerminalSessions(projectId: string): Promise<TerminalSession[]> {
    return await db.select().from(terminalSessions).where(eq(terminalSessions.projectId, projectId));
  }

  async getTerminalSession(id: string): Promise<TerminalSession | undefined> {
    const [session] = await db.select().from(terminalSessions).where(eq(terminalSessions.id, id));
    return session || undefined;
  }

  async createTerminalSession(insertSession: InsertTerminalSession): Promise<TerminalSession> {
    const [session] = await db.insert(terminalSessions).values(insertSession).returning();
    return session;
  }

  async updateTerminalHistory(id: string, history: any[]): Promise<TerminalSession | undefined> {
    const [session] = await db
      .update(terminalSessions)
      .set({ history })
      .where(eq(terminalSessions.id, id))
      .returning();
    return session || undefined;
  }

  async deleteTerminalSession(id: string): Promise<void> {
    await db.delete(terminalSessions).where(eq(terminalSessions.id, id));
  }

  // Database Schemas
  async getAllDbSchemas(projectId: string): Promise<DbSchema[]> {
    return await db.select().from(dbSchemas).where(eq(dbSchemas.projectId, projectId));
  }

  async createDbSchema(insertSchema: InsertDbSchema): Promise<DbSchema> {
    const [schema] = await db.insert(dbSchemas).values(insertSchema).returning();
    return schema;
  }

  async deleteDbSchema(id: string): Promise<void> {
    await db.delete(dbSchemas).where(eq(dbSchemas.id, id));
  }

  // Secrets
  async getAllSecrets(projectId: string): Promise<Secret[]> {
    return await db.select().from(secrets).where(eq(secrets.projectId, projectId));
  }

  async createSecret(insertSecret: InsertSecret): Promise<Secret> {
    const [secret] = await db.insert(secrets).values(insertSecret).returning();
    return secret;
  }

  async deleteSecret(id: string): Promise<void> {
    await db.delete(secrets).where(eq(secrets.id, id));
  }

  // Workflows
  async getAllWorkflows(projectId: string): Promise<Workflow[]> {
    return await db.select().from(workflows).where(eq(workflows.projectId, projectId)).orderBy(desc(workflows.createdAt));
  }

  async getWorkflow(id: string): Promise<Workflow | undefined> {
    const [workflow] = await db.select().from(workflows).where(eq(workflows.id, id));
    return workflow || undefined;
  }

  async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
    const [workflow] = await db.insert(workflows).values(insertWorkflow).returning();
    return workflow;
  }

  async updateWorkflow(id: string, data: Partial<Workflow>): Promise<Workflow | undefined> {
    const [workflow] = await db.update(workflows).set(data).where(eq(workflows.id, id)).returning();
    return workflow || undefined;
  }

  async deleteWorkflow(id: string): Promise<void> {
    await db.delete(workflows).where(eq(workflows.id, id));
  }

  // Agent Tasks
  async getAllAgentTasks(projectId: string): Promise<AgentTask[]> {
    return await db.select().from(agentTasks).where(eq(agentTasks.projectId, projectId)).orderBy(desc(agentTasks.createdAt));
  }

  async getCurrentAgentTask(projectId: string): Promise<AgentTask | undefined> {
    const [task] = await db
      .select()
      .from(agentTasks)
      .where(eq(agentTasks.projectId, projectId))
      .orderBy(desc(agentTasks.createdAt))
      .limit(1);
    return task || undefined;
  }

  async createAgentTask(insertTask: InsertAgentTask): Promise<AgentTask> {
    const [task] = await db.insert(agentTasks).values(insertTask).returning();
    return task;
  }

  async updateAgentTask(id: string, data: Partial<AgentTask>): Promise<AgentTask | undefined> {
    const [task] = await db.update(agentTasks).set(data).where(eq(agentTasks.id, id)).returning();
    return task || undefined;
  }

  // Console Logs
  async getAllConsoleLogs(projectId: string): Promise<ConsoleLog[]> {
    return await db
      .select()
      .from(consoleLogs)
      .where(eq(consoleLogs.projectId, projectId))
      .orderBy(desc(consoleLogs.timestamp))
      .limit(100);
  }

  async createConsoleLog(insertLog: InsertConsoleLog): Promise<ConsoleLog> {
    const [log] = await db.insert(consoleLogs).values(insertLog).returning();
    return log;
  }
}

export const storage = new DatabaseStorage();
