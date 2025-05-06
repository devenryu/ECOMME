Use the tasks.md checklist as your single source of truth. For each task in tasks.md, proceed as follows:
Before starting a task, update its checkbox to [-] to indicate it's in progress.
Work on the task: generate code, documentation, or UI as required by the task description.
When the task is complete, update its checkbox to [x] and commit the change (or note completion).
Move to the next unchecked task and repeat steps 1–3 until all tasks are [x].
Example Workflow- [-] Initialize Git repo, push to remote    <!-- in-progress -->
- [ ] Create basic frontend scaffold         <!-- not started -->
- [x] Initialize Git repo, push to remote    <!-- done -->
- [-] Create basic frontend scaffold         <!-- now in-progress -->Execution GuidelinesAlways refer back to the exact wording in tasks.md when marking progress.
Do not skip tasks; complete them in the order listed unless dependencies force reordering.
For each completed task, include a brief comment or commit message summarizing what was done.
If you encounter blockers, leave the task marked [-] and add a note describing the issue.
Continue this process until every task in tasks.md is marked [x]. Good luck!

Always use pnpm