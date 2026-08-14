import { IconLoader } from "@/components/ui/IconLoader";

export default function Loading() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black">
      <IconLoader size={64} />
    </div>
  );
}
