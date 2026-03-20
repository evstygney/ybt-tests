import { getExercises } from "@/lib/data";
import { AdminEditor } from "@/components/admin/admin-editor";

export function generateStaticParams() {
  return getExercises().map((exercise) => ({
    slug: exercise.slug
  }));
}

export default async function AdminExercisePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <AdminEditor slug={slug} />;
}
