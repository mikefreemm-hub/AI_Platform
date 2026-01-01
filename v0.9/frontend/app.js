async function generateSite() {
  const prompt = document.getElementById("prompt").value;

  await fetch("/generate-site", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });

  alert("Site generated");
}

async function editPage() {
  const site = document.getElementById("site").value;
  const page = document.getElementById("page").value;
  const sections = document
    .getElementById("sections")
    .value.split(",")
    .map(s => s.trim())
    .filter(Boolean);

  await fetch("/edit-page", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ site, page, sections })
  });

  alert("Page updated");
}

async function editTestimonials() {
  const site = document.getElementById("site").value;
  const page = document.getElementById("page").value;
  const quotes = document
    .getElementById("quotes")
    .value.split("\n")
    .map(q => q.trim())
    .filter(Boolean);

  await fetch("/edit-testimonials", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ site, page, quotes })
  });

  alert("Testimonials updated");
}

async function openLatest() {
  const site = document.getElementById("site").value;

  const res = await fetch(`/builds/${site}/revisions`);
  alert("Open the latest revision manually for now.\n(This button is intentionally simple in v0.9)");
}
