// Smoke tests for the main flows. They use the accounts created by backend/scripts/seed_data.py.
import { expect, test } from "@playwright/test";

const ACCOUNTS = {
  admin: { email: "admin@college.edu", password: "AdminPass123!" },
  instructor: { email: "instructor1@college.edu", password: "InstPass123!" },
  student: { email: "student1@college.edu", password: "StudPass123!" },
};

async function signIn(page, who) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(ACCOUNTS[who].email);
  await page.getByLabel(/password/i).fill(ACCOUNTS[who].password);
  await page.getByRole("button", { name: /sign in/i }).click();
}

test("a wrong password shows an error and stays on the login page", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(ACCOUNTS.student.email);
  await page.getByLabel(/password/i).fill("wrong-password");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page.getByText(/invalid credentials/i)).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("forgot password gives the same message for any email", async ({ page }) => {
  await page.goto("/forgot-password");
  await page.getByLabel(/email/i).fill("nobody@college.edu");
  await page.getByRole("button", { name: /send reset link/i }).click();
  await expect(page.getByText(/if this email belongs to an account/i)).toBeVisible();
});

test("a student sees Experiments and View Progress, not the admin pages", async ({ page }) => {
  await signIn(page, "student");
  await expect(page.getByRole("link", { name: "Experiments" })).toBeVisible();
  await expect(page.getByRole("link", { name: "View Progress" })).toBeVisible();
  await page.goto("/admin/batches");
  await expect(page).not.toHaveURL(/\/admin/);
});

test("an instructor sees Batches", async ({ page }) => {
  await signIn(page, "instructor");
  await expect(page.getByRole("link", { name: "Batches" })).toBeVisible();
  await page.getByRole("link", { name: "Batches" }).click();
  await expect(page.getByRole("heading", { name: "Batches" })).toBeVisible();
});

test("an admin sees Batches, Instructors and Students", async ({ page }) => {
  await signIn(page, "admin");
  for (const name of ["Batches", "Instructors", "Students"]) {
    await expect(page.getByRole("link", { name })).toBeVisible();
  }
  await page.getByRole("link", { name: "Students" }).click();
  await expect(page.getByRole("button", { name: "Add student" })).toBeVisible();
});

test("logging out returns to the login page", async ({ page }) => {
  await signIn(page, "student");
  await page.getByRole("button", { name: /account menu|profile/i }).click();
  await page.getByRole("button", { name: /log out/i }).click();
  await expect(page).toHaveURL(/\/login/);
});
