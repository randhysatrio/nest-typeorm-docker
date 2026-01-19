export function calculateOffset(page: number, size: number) {
  return (page - 1) * size;
}

export function calculatePaginationMeta(
  count: number,
  page: number,
  size: number,
) {
  const totalPages = Math.ceil(count / size);

  return {
    totalData: count,
    totalPages,
    page,
    size,
  };
}
