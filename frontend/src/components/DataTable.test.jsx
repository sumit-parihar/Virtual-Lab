import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DataTable from "./DataTable.jsx";

const columns = [
  { key: "urn", label: "URN", value: (r) => r.urn },
  { key: "name", label: "Name", value: (r) => r.name },
];
const rows = [
  { id: 1, urn: "CS003", name: "Ravi Kumar" },
  { id: 2, urn: "CS001", name: "Asha Patil" },
  { id: 3, urn: "CS002", name: "Meera Shah" },
];

function setup(props = {}) {
  return render(
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      searchText={(r) => `${r.name} ${r.urn}`}
      searchPlaceholder="Search"
      emptyMessage="Nothing here"
      initialSort={{ key: "urn", dir: "asc" }}
      {...props}
    />
  );
}

const bodyNames = () =>
  within(screen.getAllByRole("rowgroup")[1])
    .getAllByRole("row")
    .map((r) => within(r).getAllByRole("cell")[1].textContent);

describe("DataTable", () => {
  it("sorts by the starting column", () => {
    setup();
    expect(bodyNames()).toEqual(["Asha Patil", "Meera Shah", "Ravi Kumar"]);
  });

  it("sorts the other way when the header is clicked again", async () => {
    setup();
    await userEvent.click(screen.getByRole("button", { name: /URN/ }));
    expect(bodyNames()).toEqual(["Ravi Kumar", "Meera Shah", "Asha Patil"]);
  });

  it("searches by name or URN", async () => {
    setup();
    await userEvent.type(screen.getByRole("searchbox"), "meera");
    expect(bodyNames()).toEqual(["Meera Shah"]);
    await userEvent.clear(screen.getByRole("searchbox"));
    await userEvent.type(screen.getByRole("searchbox"), "CS003");
    expect(bodyNames()).toEqual(["Ravi Kumar"]);
  });

  it("explains when nothing matches or there are no rows", async () => {
    setup();
    await userEvent.type(screen.getByRole("searchbox"), "zzz");
    expect(screen.getByText(/no students match your search/i)).toBeInTheDocument();
  });

  it("shows the empty message when there are no rows", () => {
    setup({ rows: [] });
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("shows 25 rows per page and can go to the next page", async () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ id: i, urn: `U${String(i).padStart(3, "0")}`, name: `Student ${i}` }));
    setup({ rows: many });
    expect(bodyNames()).toHaveLength(25);
    expect(screen.getByText(/Showing 1–25 of 30/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(bodyNames()).toHaveLength(5);
    expect(screen.getByText(/Page 2 of 2/)).toBeInTheDocument();
  });
});
