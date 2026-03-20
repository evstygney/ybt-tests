import { getExercises } from "@/lib/data";
import { ExercisePlayer } from "@/components/exercise/exercise-player";

export function generateStaticParams() {
  return getExercises().map((exercise) => ({
    slug: exercise.slug
  }));
}

export default async function ExercisePage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ embed?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  return <ExercisePlayer slug={slug} embed={query.embed === "1"} />;
}
