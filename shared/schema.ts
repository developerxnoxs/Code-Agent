import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Projects table - represents workspaces
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Files table - represents files in the workspace
export const files = pgTable("files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  path: text("path").notNull(), // full path including filename
  content: text("content").notNull().default(""),
  language: text("language"), // programming language for syntax highlighting
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Terminal sessions
export const terminalSessions = pgTable("terminal_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  history: jsonb("history").$type<{ command: string; output: string; timestamp: string; exitCode: number }[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Database schemas/tables metadata
export const dbSchemas = pgTable("db_schemas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  tableName: text("table_name").notNull(),
  schema: jsonb("schema").$type<{ columns: { name: string; type: string; nullable: boolean }[] }>().notNull(),
  rowCount: integer("row_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Secrets storage
export const secrets = pgTable("secrets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  value: text("value").notNull(), // encrypted value
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Workflows - autonomous task sequences
export const workflows = pgTable("workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  steps: jsonb("steps").$type<{ id: string; type: string; action: string; parameters: any; status: 'pending' | 'running' | 'completed' | 'failed' }[]>().default([]),
  status: text("status").notNull().default("pending"), // pending, running, completed, failed
  isAutonomous: boolean("is_autonomous").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Agent tasks - individual operations the AI performs
export const agentTasks = pgTable("agent_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  workflowId: varchar("workflow_id").references(() => workflows.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // code_generation, bug_fix, file_operation, terminal_command, database_query
  description: text("description").notNull(),
  input: jsonb("input").notNull(),
  output: jsonb("output"),
  status: text("status").notNull().default("pending"), // pending, running, completed, failed
  error: text("error"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Console logs - AI agent activity tracking
export const consoleLogs = pgTable("console_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  taskId: varchar("task_id").references(() => agentTasks.id, { onDelete: "cascade" }),
  level: text("level").notNull(), // info, warning, error, success
  message: text("message").notNull(),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Relations
export const projectsRelations = relations(projects, ({ many }) => ({
  files: many(files),
  terminalSessions: many(terminalSessions),
  dbSchemas: many(dbSchemas),
  secrets: many(secrets),
  workflows: many(workflows),
  agentTasks: many(agentTasks),
  consoleLogs: many(consoleLogs),
}));

export const filesRelations = relations(files, ({ one }) => ({
  project: one(projects, {
    fields: [files.projectId],
    references: [projects.id],
  }),
}));

export const terminalSessionsRelations = relations(terminalSessions, ({ one }) => ({
  project: one(projects, {
    fields: [terminalSessions.projectId],
    references: [projects.id],
  }),
}));

export const dbSchemasRelations = relations(dbSchemas, ({ one }) => ({
  project: one(projects, {
    fields: [dbSchemas.projectId],
    references: [projects.id],
  }),
}));

export const secretsRelations = relations(secrets, ({ one }) => ({
  project: one(projects, {
    fields: [secrets.projectId],
    references: [projects.id],
  }),
}));

export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  project: one(projects, {
    fields: [workflows.projectId],
    references: [projects.id],
  }),
  tasks: many(agentTasks),
}));

export const agentTasksRelations = relations(agentTasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [agentTasks.projectId],
    references: [projects.id],
  }),
  workflow: one(workflows, {
    fields: [agentTasks.workflowId],
    references: [workflows.id],
  }),
  logs: many(consoleLogs),
}));

export const consoleLogsRelations = relations(consoleLogs, ({ one }) => ({
  project: one(projects, {
    fields: [consoleLogs.projectId],
    references: [projects.id],
  }),
  task: one(agentTasks, {
    fields: [consoleLogs.taskId],
    references: [agentTasks.id],
  }),
}));

// Insert schemas
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTerminalSessionSchema = createInsertSchema(terminalSessions).omit({
  id: true,
  createdAt: true,
});

export const insertDbSchemaSchema = createInsertSchema(dbSchemas).omit({
  id: true,
  createdAt: true,
});

export const insertSecretSchema = createInsertSchema(secrets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertAgentTaskSchema = createInsertSchema(agentTasks).omit({
  id: true,
  createdAt: true,
  startedAt: true,
  completedAt: true,
});

export const insertConsoleLogSchema = createInsertSchema(consoleLogs).omit({
  id: true,
  timestamp: true,
});

// Types
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;

export type TerminalSession = typeof terminalSessions.$inferSelect;
export type InsertTerminalSession = z.infer<typeof insertTerminalSessionSchema>;

export type DbSchema = typeof dbSchemas.$inferSelect;
export type InsertDbSchema = z.infer<typeof insertDbSchemaSchema>;

export type Secret = typeof secrets.$inferSelect;
export type InsertSecret = z.infer<typeof insertSecretSchema>;

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;

export type AgentTask = typeof agentTasks.$inferSelect;
export type InsertAgentTask = z.infer<typeof insertAgentTaskSchema>;

export type ConsoleLog = typeof consoleLogs.$inferSelect;
export type InsertConsoleLog = z.infer<typeof insertConsoleLogSchema>;
