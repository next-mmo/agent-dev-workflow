# Defensive Patterns

Read this before lifecycle, concurrency, subprocess, provider, filesystem, or teardown work. These are reusable bug-class rules; test-specific reliability guidance lives in [`testing.md`](testing.md).

## Keep independent outcomes independent

A process/provider result may time out, receive a signal, exit with a code, return partial output, and fail verification at the same time. Record each fact independently. Do not let a successful exit mask a timeout or let a timeout erase useful diagnostics.

## Normalize at public boundaries

When several internal representations mean the same public outcome, normalize them at the owner of the public contract. Callers should not need to guess whether equivalent failure/success states arrive through return values, events, or exceptions.

## Async state is not per-operation state

A global `idle`, `running`, or `closed` signal may cover several queued operations. Do not attribute it to one request unless the API explicitly defines that ownership interval. Name what event/state proves the specific operation completed.

## Dispose to quiescence

Cleanup is not complete when it merely requests `abort`, `close`, or `kill`. Stop new callbacks/listeners when appropriate, request termination, then await the owned exit/close/completion signal so late work cannot mutate the next task/test.

## Allocate resources atomically

Use OS-assigned ports, `mkdtemp`, unique namespaces, and exclusive file creation. “Check whether free, then claim” races with other processes and CI jobs.

## Contain callback failures at the dispatcher

A user/provider callback that throws should not accidentally starve independent listeners or corrupt the owner lifecycle unless the contract explicitly says it can. Catch/log/isolate at the dispatcher boundary that owns callback execution.

## Treat cross-boundary data as untrusted

Validate/sanitize at parser, configuration, model/tool JSON, durable file, subprocess, worker, provider, and wire boundaries. Do not add defensive validation solely for values already guaranteed by a typed same-process interface unless another boundary can actually violate it.

## Protect credentials and temporary output

Do not expose ambient secrets to untrusted subprocess/provider output. Prefer argument arrays over shell interpolation, redact credential-shaped diagnostics, use private random temporary paths, and avoid predictable shared spill files.

## Publish only after success

Emit notifications and update derived/cached state at the operation's commit point unless the contract explicitly models intermediate state. Consumers should derive from one authoritative source rather than several independently mutable mirrors.

## Enforce limits on the final owned result

Apply byte/token/item/time bounds where the complete emitted or retained result—including wrappers/metadata—is known. A provider-local limit does not replace final-owner enforcement. Test tiny/exact limits, oversized single items, and multibyte byte cases when relevant.
