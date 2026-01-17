#!/usr/bin/env node

import { Command } from "commander";
import { add } from "./commands/add.js";
import { init } from "./commands/init.js";
import { list } from "./commands/list.js";

const program = new Command();

program.name("sinew").description("Infrastructure patterns for your project").version("0.1.0");

program.command("init").description("Initialize sinew in your project").action(init);

program
  .command("add [pattern]")
  .description("Add a pattern to your project (e.g., database/connection-pooling)")
  .action(add);

program.command("list").alias("ls").description("List all available patterns").action(list);

program.parse();
