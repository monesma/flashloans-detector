export function decodAddress(hexAddress: string | undefined | null) {
  if (hexAddress && typeof hexAddress === "string") {
    if (hexAddress.startsWith("0x")) {
      let normalizedAddress = hexAddress.replace(/^0x0+/g, "0x");
      return normalizedAddress;
    } else {
      return null;
    }
  } else {
    return null;
  }
}
