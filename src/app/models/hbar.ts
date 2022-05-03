export function stringifyHbar(value: number): string {
    const hbar = ~~(value / 100_000_000);
    const tbar = value % 100_000_000;
    if (tbar == 0) {
        return `${hbar} ℏ`;
    }
    return value < 0 ?
        `-${-hbar}.${(-tbar).toFixed(0).padStart(8, '0')} ℏ` :
        `${hbar}.${tbar.toFixed(0).padStart(8, '0')} ℏ`;
}
