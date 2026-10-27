# Admin guide

Sign in with the admin account. The top menu has **Batches**, **Instructors** and **Students**.

## First-time setup (in this order)
1. **Add the batches.** Batches, then **Add batch**. Enter the batch name (for example TE-CSE-A) and the academic year.
2. **Add the instructors.** Instructors, then **Add instructor** (name and email). They receive a temporary password by email.
3. **Assign each instructor to a batch.** Open the batch, choose the instructor under **Instructor**, then **Assign instructor**.
4. **Add the students.** Open the batch and use **Add students** (a file) or **Add student** (one at a time).

## Adding students from a file
1. On the batch page, click **Download template**, fill in URN, Name and Email (one student per row), and save it as .xlsx or .csv.
2. Choose the file and click **Check file**. Every row shows Ready, Skipped or Invalid with the reason. Nothing is saved yet.
3. Click **Import**. The good rows are added; the rest are skipped. Use **Download rows with problems**, fix them and upload again.
4. A student already in another batch is skipped: use **Move** instead.

## Everyday tasks
- **Replace or remove an instructor:** open the batch, choose another instructor and click **Replace instructor**, or click **Remove instructor**.
- **Move a student:** Students (or the batch page), **Move**, pick the batch. Their progress and scores move with them.
- **Correct details:** **Edit** on a student or instructor. A URN or email that belongs to someone else is rejected.
- **A person cannot sign in:** check their status. **Invited** means they have not signed in yet: use **Resend invitation**. **Email failed** means the email did not go out. **Reset password** gives an active person a new temporary password.
- **Someone leaves:** **Deactivate** (they cannot sign in; nothing is deleted; **Reactivate** brings them back). An instructor who still has a batch needs a new instructor for that batch.
- **A batch is finished:** open it and click **Archive** (hidden from lists and from the instructor; **Restore** brings it back). Tick **Show archived batches** to see them.

## Good to know
- Nothing is deleted permanently.
- New people get a random temporary password and must change it the first time they sign in.
- If the email server is not set up, the temporary passwords are shown in the server's console window, and the status says "Email is off".
- You cannot deactivate your own account or the last active admin.
- After 5 wrong passwords an account is locked for 15 minutes. **Reset password** (or the person's "Forgot password?") unlocks it.
