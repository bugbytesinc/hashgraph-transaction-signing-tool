export function fromHex(value: string): Uint8Array {
    const a = [];
    for (let i = 0, len = value.length; i < len; i += 2) {
        a.push(parseInt(value.substring(i, i + 2), 16));
    }
    return new Uint8Array(a);
}

export function toHex(value: Uint8Array): string {
    return Array.from(value).map(c => c.toString(16).padStart(2, '0')).join('');
}