#!/usr/bin/env node
import { runApply } from "./commands/apply.js";
import { runSearch } from "./commands/search.js";
import { runTrackList, runTrackStatus } from "./commands/track.js";

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case "search": {
      const limitFlagIdx = args.indexOf("--limit");
      const limit = limitFlagIdx >= 0 ? Number(args[limitFlagIdx + 1]) : 20;
      const keywords = args.filter((a, i) => a !== "--limit" && args[i - 1] !== "--limit");
      await runSearch(keywords, limit);
      break;
    }
    case "apply": {
      const index = Number(args[0]);
      if (Number.isNaN(index)) throw new Error("Uso: apply <índice>");
      await runApply(index);
      break;
    }
    case "track": {
      const [sub, ...rest] = args;
      if (sub === "status") {
        const [id, status] = rest;
        if (!id || !status) throw new Error("Uso: track status <id> <estado>");
        await runTrackStatus(id, status);
      } else {
        await runTrackList();
      }
      break;
    }
    default:
      console.log("Uso:");
      console.log("  search <keywords...> [--limit N]");
      console.log("  apply <índice>");
      console.log("  track [status <id> <estado>]");
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
