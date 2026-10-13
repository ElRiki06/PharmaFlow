export function download(name, text, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function csv(rows) {
  // Evita que celdas controladas por usuarios se interpreten como fórmulas.
  return (
    "\uFEFF" +
    rows
      .map((row) =>
        row
          .map((value) => {
            const str = String(value ?? "");
            return `"${/^[=+@-]/.test(str) ? "'" : ""}${str.replaceAll('"', '""')}"`;
          })
          .join(","),
      )
      .join("\r\n")
  );
}
export function parseStock(text) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .trim()
    .split(/\r?\n/);
  const clean = (v) => v.trim().replace(/^"|"$/g, "");
  if (lines.shift()?.split(",").map(clean).join(",") !== "id,quantity,minimum")
    throw new Error(
      "Usa las columnas id,quantity,minimum. Descarga la plantilla para ver el formato.",
    );
  return lines.map((line, i) => {
    const cells = line.split(",").map(clean);
    if (cells.length !== 3 || cells.some((c) => !/^\d+$/.test(c)))
      throw new Error(`La fila ${i + 2} contiene cantidades inválidas.`);
    return {
      id: Number(cells[0]),
      quantity: Number(cells[1]),
      minimum: Number(cells[2]),
    };
  });
}
export function imageFile(file) {
  return new Promise((resolve, reject) => {
    if (
      !file ||
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 2097152
    )
      return reject(
        new Error("Selecciona una imagen PNG, JPG o WebP de hasta 2 MB."),
      );
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });
}
