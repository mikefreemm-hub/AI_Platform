export function patchSpec(spec, patch) {
  if (!patch || !patch.type) {
    throw new Error("Patch missing type");
  }

  switch (patch.type) {

    case "update_page_title": {
      const page = spec.site.pages.find(p => p.slug === patch.slug);
      if (!page) throw new Error("Page not found: " + patch.slug);
      page.title = patch.title;
      return spec;
    }

    case "update_site_purpose": {
      spec.site.purpose = patch.purpose;
      return spec;
    }

    default:
      throw new Error("Unknown patch type: " + patch.type);
  }
}
