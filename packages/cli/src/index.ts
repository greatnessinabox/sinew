#!/usr/bin/env node

import { Command } from "commander";
import { add } from "./commands/add.js";
import { init } from "./commands/init.js";
import { list } from "./commands/list.js";
import { audit } from "./commands/audit.js";
import { update } from "./commands/update.js";
import pkg from "../package.json" with { type: "json" };

const program = new Command();

program.name("sinew").description("Infrastructure patterns for your project").version(pkg.version);

program.command("init").description("Initialize sinew in your project").action(init);

program
  .command("add [pattern]")
  .description("Add a pattern to your project (e.g., database/connection-pooling)")
  .action(add);

program.command("list").alias("ls").description("List all available patterns").action(list);

program
  .command("audit")
  .description("Check tracked patterns against the current registry")
  .action(audit);

program
  .command("update [pattern]")
  .description("Pull the latest registry version of outdated patterns")
  .action(update);

program.parse();
