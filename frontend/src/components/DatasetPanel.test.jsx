import { render, screen } from "@testing-library/react";
import DatasetPanel from "./DatasetPanel.jsx";

const salaryInfo = {
  name: "Salary dataset",
  file_url: "/datasets/Salary_dataset.csv",
  description: "Years of work experience and salary for employees.",
  row_meaning: "one employee",
  load_hint: 'pd.read_csv("Salary_dataset.csv")',
  columns: [
    {
      name: "YearsExperience",
      meaning: "Years worked",
      unit: "years",
      role: "feature",
    },
    { name: "Salary", meaning: "Salary to predict", unit: "", role: "target" },
  ],
  class_column: null,
  sample_rows: 2,
};

function mockFile(text, ok = true) {
  globalThis.fetch = vi.fn(() =>
    Promise.resolve({
      ok,
      status: ok ? 200 : 404,
      text: () => Promise.resolve(text),
    }),
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DatasetPanel", () => {
  it("shows the size, the columns and the first sample rows read from the file", async () => {
    mockFile("YearsExperience,Salary\n1.2,39344\n1.4,46206\n1.6,37732\n");
    render(<DatasetPanel info={salaryInfo} defaultOpen />);

    expect(await screen.findByText("3 rows × 2 columns")).toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/datasets/Salary_dataset.csv",
    );
    expect(screen.getByText("Feature (x)")).toBeInTheDocument();
    expect(screen.getByText("Target (y)")).toBeInTheDocument();
    expect(screen.getByText("Each row is one employee.")).toBeInTheDocument();
    expect(screen.getByText("The first 2 of 3 rows.")).toBeInTheDocument();
    expect(screen.getByText("39344")).toBeInTheDocument();
    expect(screen.getByText("46206")).toBeInTheDocument();
    expect(screen.queryByText("37732")).not.toBeInTheDocument(); // only sample_rows rows are shown
    expect(screen.queryByText("Rows in each class")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /download/i }),
    ).not.toBeInTheDocument();
  });

  it("counts the rows in each class for a classification dataset", async () => {
    mockFile("petal_length,species\n1.4,setosa\n4.7,versicolor\n1.3,setosa\n");
    const info = {
      ...salaryInfo,
      name: "Iris",
      file_url: "/datasets/iris.csv",
      class_column: "species",
      columns: [
        {
          name: "petal_length",
          meaning: "Petal length",
          unit: "cm",
          role: "feature",
        },
        {
          name: "species",
          meaning: "Flower species",
          unit: "",
          role: "target",
        },
      ],
    };
    render(<DatasetPanel info={info} defaultOpen />);

    expect(await screen.findByText("Rows in each class")).toBeInTheDocument();
    const counts = screen.getByText("Rows in each class").nextElementSibling;
    expect(counts.textContent).toContain("setosa: 2");
    expect(counts.textContent).toContain("versicolor: 1");
  });

  it("names the classes, marks unused columns and describes column groups", async () => {
    mockFile("p1,p2,target\n1,2,0\n3,4,1\n5,6,0\n");
    const info = {
      ...salaryInfo,
      class_column: "target",
      class_names: { 0: "malignant", 1: "benign" },
      columns: [
        {
          name: "p1 … p2",
          meaning: "Two pixels",
          unit: "",
          role: "feature",
          count: 2,
        },
        { name: "target", meaning: "Class", unit: "", role: "unused" },
      ],
    };
    render(<DatasetPanel info={info} defaultOpen />);

    const counts = (await screen.findByText("Rows in each class"))
      .nextElementSibling;
    expect(counts.textContent).toContain("0 = malignant: 2 rows");
    expect(counts.textContent).toContain("1 = benign: 1 row");
    expect(screen.getByText("Not used")).toBeInTheDocument();
    expect(screen.getByText("2 columns")).toBeInTheDocument();
  });

  it("spreads the samples through a file sorted by class and shows real row numbers", async () => {
    mockFile("v,target\n10,0\n11,0\n12,1\n13,1\n14,2\n15,2\n");
    const info = { ...salaryInfo, sample_rows: 3, sample_spread: true };
    render(<DatasetPanel info={info} defaultOpen />);

    expect(
      await screen.findByText(
        "3 of the 6 rows, spread evenly through the file (# is the row number).",
      ),
    ).toBeInTheDocument();
    const rows = [
      ...document.querySelectorAll(".dataset-panel__table--data tbody tr"),
    ];
    expect(rows.map((r) => r.textContent)).toEqual(["0100", "2121", "4142"]);
  });

  it("shortens very long decimals for display and says so", async () => {
    mockFile("age,target\n0.038075906433423026,151\n");
    render(<DatasetPanel info={salaryInfo} defaultOpen />);
    expect(await screen.findByText("0.0381")).toBeInTheDocument();
    expect(
      screen.getByText(/Long decimals are shortened to 4 places/),
    ).toBeInTheDocument();
  });

  it("draws image datasets as small pictures instead of a table", async () => {
    mockFile("a,b,c,d,target\n0,16,16,0,7\n16,0,0,16,1\n");
    const info = {
      ...salaryInfo,
      sample_images: { width: 2, height: 2, max: 16 },
    };
    const { container } = render(<DatasetPanel info={info} defaultOpen />);

    expect(
      await screen.findByRole("img", { name: "Image of the digit 7" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Image of the digit 1" }),
    ).toBeInTheDocument();
    expect(
      container.querySelectorAll(".dataset-panel__image rect"),
    ).toHaveLength(8);
    expect(container.querySelector(".dataset-panel__table--data")).toBeNull();
  });

  it("says so when the file cannot be loaded", async () => {
    mockFile("", false);
    render(<DatasetPanel info={salaryInfo} defaultOpen />);
    expect(
      await screen.findByText(/Could not load the dataset preview/),
    ).toBeInTheDocument();
  });

  it("starts closed unless asked to open", async () => {
    mockFile("YearsExperience,Salary\n1.2,39344\n");
    const { container } = render(<DatasetPanel info={salaryInfo} />);
    await screen.findByText("1 row × 2 columns");
    expect(container.querySelector("details").open).toBe(false);
  });
});
