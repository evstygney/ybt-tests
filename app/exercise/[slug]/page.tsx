import { getExercises } from "@/lib/data";
import { ExercisePlayer } from "@/components/exercise/exercise-player";

export function generateStaticParams() {
  return getExercises().map((exercise) => ({
    slug: exercise.slug
  }));
}

export default async function ExercisePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ExercisePlayer slug={slug} />;
}
