"""Bounded JSON process transport for a FUTURE audited runtime adapter.

Not connected to a model, CLI or the live executor. Tests inject a fake process
and fake tree terminator; importing this file never starts a process.
"""
import json
import os
import signal
import subprocess
import tempfile


class TerminationUnconfirmed(RuntimeError):
    pass


def stop_tree(process):
    if os.name == "nt":
        # /T stops children too. Never use a shell or a name-based kill.
        result = subprocess.run(["taskkill", "/PID", str(process.pid), "/T", "/F"],
                                capture_output=True, timeout=10, check=False,
                                creationflags=subprocess.CREATE_NO_WINDOW)
        if result.returncode != 0:
            raise TerminationUnconfirmed("process_tree_termination_unconfirmed")
    else:
        try:
            os.killpg(process.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
    process.wait(timeout=10)


class JsonProcessTransport:
    def __init__(self, command, *, cwd, popen=subprocess.Popen, terminate_tree=stop_tree):
        if not command or not all(isinstance(arg, str) and arg for arg in command):
            raise ValueError("fixed command array required")
        self.command = tuple(command)
        self.cwd = cwd
        self.popen = popen
        self.terminate_tree = terminate_tree
        self.termination_confirmed = False

    def request(self, payload, timeout):
        if not isinstance(timeout, (int, float)) or not 0 < timeout <= 300:
            raise ValueError("invalid timeout")
        body = json.dumps(payload, allow_nan=False).encode("utf-8")
        if len(body) > 100000:
            raise ValueError("request too large")
        self.termination_confirmed = False
        # Output goes to files so communicate() cannot consume unbounded RAM.
        # Time is bounded; disk-byte enforcement is a future adapter requirement.
        with tempfile.TemporaryFile() as out, tempfile.TemporaryFile() as err:
            options = {"creationflags": subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.CREATE_NO_WINDOW} \
                if os.name == "nt" else {"start_new_session": True}
            process = self.popen(list(self.command), cwd=self.cwd, stdin=subprocess.PIPE,
                                 stdout=out, stderr=err, shell=False, **options)
            try:
                process.communicate(input=body, timeout=timeout)
            except BaseException as exc:
                try:
                    self.terminate_tree(process)
                except BaseException as stop_error:
                    raise TerminationUnconfirmed("process_tree_termination_unconfirmed") from stop_error
                self.termination_confirmed = True
                if isinstance(exc, subprocess.TimeoutExpired):
                    raise TimeoutError("runtime_timeout") from exc
                raise
            # Even a successful CLI can leave descendants. Kill the remaining
            # group before declaring completion (Windows cannot attest this
            # after the parent exits, so live adapter stays disabled).
            if os.name != "nt":
                self.terminate_tree(process)
                self.termination_confirmed = True
            if process.returncode != 0:
                raise RuntimeError("runtime_process_failed")
            out.seek(0, 2)
            if out.tell() > 256000:
                raise ValueError("runtime_response_too_large")
            out.seek(0)
            result = json.load(out)
            if not isinstance(result, dict):
                raise ValueError("invalid_runtime_response")
            return result
