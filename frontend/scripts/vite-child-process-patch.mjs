import childProcess from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
import { EventEmitter } from "node:events";

const originalExec = childProcess.exec;

function isNetUseCommand(command) {
  return typeof command === "string" && command.trim().toLowerCase() === "net use";
}

childProcess.exec = function patchedExec(command, options, callback) {
  let resolvedOptions = options;
  let resolvedCallback = callback;

  if (typeof resolvedOptions === "function") {
    resolvedCallback = resolvedOptions;
    resolvedOptions = undefined;
  }

  if (process.platform === "win32" && isNetUseCommand(command)) {
    const child = new EventEmitter();
    child.pid = undefined;
    child.stdin = null;
    child.stdout = null;
    child.stderr = null;
    child.kill = () => true;

    queueMicrotask(() => {
      if (typeof resolvedCallback === "function") {
        resolvedCallback(null, "", "");
      }
      child.emit("exit", 0, null);
      child.emit("close", 0, null);
    });

    return child;
  }

  return originalExec.call(childProcess, command, resolvedOptions, resolvedCallback);
};

syncBuiltinESMExports();
