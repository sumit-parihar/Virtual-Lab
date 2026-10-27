# Admin Console

For admins only: instructors and students cannot open these pages or call these endpoints. The admin manages
people and batches. Nothing is deleted permanently: users are deactivated and batches are archived. The admin has no
access to the instructor console and cannot edit marks, completion or experiment content.

## Navigation
Navbar: **Home**, **Batches**, **Instructors**, **Students**, and the profile menu (My Profile, Log out).

## Batches (`/admin/batches`)
A table with the batch name, academic year, instructor, number of students and status. **Add batch** creates a batch
from a name and an academic year; an instructor can be assigned at any time afterwards. **Show archived batches** adds
archived ones to the list.

## Batch page (`/admin/batches/:batchId`)
- **Edit** the name and academic year. **Archive** hides the batch from the lists and from the instructor (nothing is
  deleted); **Restore** brings it back.
- **Instructor**: a batch has at most one. The admin can assign one, replace the current one in a single step (the new
  instructor keeps any other batches), or remove the instructor and leave the batch without one. A deactivated
  instructor is flagged with a warning to assign a new one.
- **Add students**: upload a CSV or Excel file with the columns **URN**, **Name** and **Email** (a template can be
  downloaded). **Check file** shows every row as Ready, Skipped or Invalid with the reason, and changes nothing. **Import**
  then adds the good rows and skips the rest; rows with problems can be downloaded as a CSV to fix and upload again.
  A student whose email is already in another batch is skipped ("Use Move student").
- **Students**: the batch's students with account state and the actions below. **Add student** adds one student with a
  form (URN, Name, Email) using the same checks as the file import.

## Students (`/admin/students`)
All students with a batch filter, search by name, email or URN, sorting and 25 rows per page. **Add student** adds one
student to a batch you pick. Actions on each student:
- **Edit** name, email and URN (a conflict with another account is rejected).
- **Move** to another batch. A student belongs to exactly one batch, and their progress and scores move with them.
- **Resend invitation** / **Reset password** issues a new temporary password by email. It never creates another account.
- **Deactivate** / **Reactivate**.

## Instructors (`/admin/instructors`)
**Add instructor** (name and email) emails a temporary password. The table shows each instructor's batches and account
state, with **Edit**, **Resend invitation**, **Deactivate** and **Reactivate**.

## Accounts and invitations
- New students and instructors get a random temporary password by email and must change it at their first login.
- Account state: **Invited** (not yet signed in with a new password), **Active**, **Deactivated** (cannot log in; records
  are kept and can be reactivated).
- The result of the invitation email is shown while a user is Invited: Email sent, Email failed, or Email is off (the
  password was printed in the server console).
- An admin cannot deactivate their own account or the last active admin. Changing the email of someone who has not signed
  in reminds the admin to resend the invitation.

## Effect on the instructor console
Archived batches disappear from the instructor's Batches page. Deactivated students stay visible with an **Inactive**
label. A batch without an instructor is not visible to any instructor.

## API
All endpoints are under `/admin` and need the admin role (see `openapi.yaml`): batches (list, create, get, edit, archive,
restore, `PUT`/`DELETE` instructor), student import (`students/preview`, `students/import`, `students/template`),
students (list, edit, move), instructors (list, create, edit) and user actions (deactivate, reactivate, resend-invitation).
