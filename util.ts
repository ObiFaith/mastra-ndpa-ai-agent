import fs from "fs";

export const splitTextToChunks = async () => {
  // Load text
  const text = fs.readFileSync("ndpa.txt", "utf8");

  // Split by PART headers
  const parts = text.split(/(?=PART\s+[IVX]+)/g);

  const structuredActs = parts.map(partText => {
    const partMatch = partText.match(/(PART\s+[IVX]+[^\n]*)/);
    const partTitle = partMatch ? partMatch[1].trim() : "UNKNOWN PART";

    // Find all sections within this Part
    const sections = [];
    const sectionRegex =
      /(\d+)\.\s*[–—-]\s*\(?(\d*)\)?([\s\S]*?)(?=(?:\r?\n)?\d+\.\s*[–—-]|\Z)/g;
    let match;
    while ((match = sectionRegex.exec(partText)) !== null) {
      const sectionNumber = match[1];
      const sectionContent = match[3].replace(/\n+/g, " ").trim();
      sections.push({
        section_number: sectionNumber,
        content: sectionContent,
      });
    }

    return { part: partTitle, sections };
  });

  // Save to JSON
  fs.writeFileSync(
    "ndpa_structured.json",
    JSON.stringify(structuredActs, null, 2)
  );
  console.log("✅ NDPA structured into parts and sections!");
};

splitTextToChunks();
