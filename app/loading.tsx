export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div
        className="w-8 h-8 rounded-full border border-white/15 border-t-white/60 animate-spin"
        aria-label="Loading"
      />
    </div>
  );
}
