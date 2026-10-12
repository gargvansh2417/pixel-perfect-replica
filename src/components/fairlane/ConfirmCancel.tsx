import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cancelJob } from "@/lib/job-store";
import { btn } from "./buttons";

export function ConfirmCancel({ jobId, onClose }: { jobId: string | null; onClose: () => void }) {
  return (
    <AlertDialog open={!!jobId} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent className="border-border bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">Cancel job {jobId}?</AlertDialogTitle>
          <AlertDialogDescription className="text-subtle-foreground">This action cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className={btn("secondary")}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={btn("error")}
            onClick={() => {
              if (jobId) {
                cancelJob(jobId);
                toast.success(`Job ${jobId} cancelled`);
              }
              onClose();
            }}
          >
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
