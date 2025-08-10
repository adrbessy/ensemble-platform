export function dbg(tag: string, data?: any) {
  const t = new Date().toISOString().split('T')[1]; // HH:mm:ss.sssZ
  if (data !== undefined) {
    console.log(`[${t}] ${tag}`, data);
  } else {
    console.log(`[${t}] ${tag}`);
  }
}
