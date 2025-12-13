export async function DELETE({ params }: { params: { id: string } }) {
  const { id } = await params;
  console.log("🚀 ~ DELETE ~ id:", id);
}
