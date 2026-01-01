export function getRubric() {
  return {
    version: "v0.11",
    checks: [
      { id: "spec_exists", weight: 15 },
      { id: "spec_valid_json", weight: 15 },
      { id: "site_folder_exists", weight: 10 },
      { id: "revision_folder_exists", weight: 10 },
      { id: "index_html_exists", weight: 20 },
      { id: "has_multiple_pages", weight: 10 },
      { id: "static_assets_present", weight: 10 },
      { id: "no_empty_files", weight: 10 }
    ]
  };
}
