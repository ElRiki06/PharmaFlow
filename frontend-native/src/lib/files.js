import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
export async function download(name, text, type = "text/csv;charset=utf-8") {
  if (Platform.OS !== 'web') {
    const path = FileSystem.cacheDirectory + name;
    await FileSystem.writeAsStringAsync(path, text);
    if (!(await Sharing.isAvailableAsync())) throw new Error('No se puede compartir archivos en este dispositivo.');
    await Sharing.shareAsync(path, {mimeType:type.split(';')[0]});
    return;
  }
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
export async function pickImage(camera = false) {
  if (camera && !(await ImagePicker.requestCameraPermissionsAsync()).granted) throw new Error('Permite el acceso a la cámara.');
  const result = await (camera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync)({mediaTypes:['images'],base64:true,quality:.8});
  if (result.canceled) return null;
  const asset=result.assets[0];
  const image=await ImageManipulator.manipulateAsync(asset.uri,[{resize:{width:Math.min(asset.width||1400,1400)}}],{compress:.8,format:ImageManipulator.SaveFormat.JPEG,base64:true});
  if (!image.base64 || image.base64.length>2796204) throw new Error('La receta debe pesar como máximo 2 MB. Selecciona una imagen menor.');
  return 'data:image/jpeg;base64,'+image.base64;
}
export async function pickDocument() {
  const result=await DocumentPicker.getDocumentAsync({type:['text/csv','text/plain','application/vnd.ms-excel'],copyToCacheDirectory:true});
  if(result.canceled)return null;
  const asset=result.assets[0];
  if(asset.size>2097152)throw new Error('El CSV debe pesar menos de 2 MB.');
  return Platform.OS==='web'?await (await fetch(asset.uri)).text():await FileSystem.readAsStringAsync(asset.uri);
}
