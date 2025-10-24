import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface TermsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TermsDialog = ({ open, onOpenChange }: TermsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-green-700 dark:text-green-400">
            Terms and Conditions
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-600 dark:text-gray-300">
            Please read and understand these terms before accessing the system.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-xs dark:text-gray-300">
          {/* Staff and Admin Only Section */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded">
            <h3 className="font-bold text-sm text-yellow-800 dark:text-yellow-400 mb-2">
              Staff and Admin Users Only
            </h3>
            <p className="text-yellow-900 dark:text-yellow-200">
              This system is exclusively designed for authorized <strong>staff members</strong> and{" "}
              <strong>administrators</strong> of the EcoBin waste management platform. Access is restricted
              to personnel with official roles in waste collection, monitoring, and system administration.
            </p>
          </div>

          {/* Section 1: Access and Authorization */}
          <div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-2">
              1. Access and Authorization
            </h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li>
                This platform is intended for use by authorized staff and administrators only.
              </li>
              <li>
                Users must have valid credentials provided by the organization.
              </li>
              <li>
                Unauthorized access or sharing of credentials is strictly prohibited.
              </li>
              <li>
                The organization reserves the right to revoke access at any time.
              </li>
            </ul>
          </div>

          {/* Section 2: User Responsibilities */}
          <div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-2">
              2. User Responsibilities
            </h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li>Keep your login credentials confidential and secure.</li>
              <li>Use the system only for authorized work-related purposes.</li>
              <li>
                Accurately record and report bin statuses, waste collection data, and other system
                information.
              </li>
              <li>Notify administrators immediately if you suspect unauthorized access.</li>
              <li>Comply with all organizational policies and data protection regulations.</li>
            </ul>
          </div>

          {/* Section 3: Data Privacy and Security */}
          <div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-2">
              3. Data Privacy and Security
            </h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li>All data accessed through this system is confidential and proprietary.</li>
              <li>Users must not disclose, share, or misuse system data.</li>
              <li>
                The system collects and processes data in accordance with applicable privacy laws.
              </li>
              <li>Users are responsible for maintaining the security of their accounts.</li>
            </ul>
          </div>

          {/* Section 4: Prohibited Activities */}
          <div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-2">
              4. Prohibited Activities
            </h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li>Attempting to access unauthorized areas of the system.</li>
              <li>Tampering with, modifying, or reverse-engineering system components.</li>
              <li>Introducing malware, viruses, or harmful code.</li>
              <li>Using the system for personal gain or non-work-related activities.</li>
              <li>Interfering with other users' access or system operations.</li>
            </ul>
          </div>

          {/* Section 5: Termination */}
          <div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-2">
              5. Account Termination
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              The organization reserves the right to suspend or terminate user accounts for violations
              of these terms, misuse of the system, or when employment/contract ends. All access rights
              will be immediately revoked upon termination.
            </p>
          </div>

          {/* Section 6: Acceptance */}
          <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded">
            <h3 className="font-bold text-sm text-green-800 dark:text-green-400 mb-2">
              6. Acceptance of Terms
            </h3>
            <p className="text-green-900 dark:text-green-200">
              By checking the "I agree to the Terms and Conditions" box and accessing this system, you
              acknowledge that you have read, understood, and agree to be bound by these terms and
              conditions as an authorized staff member or administrator.
            </p>
          </div>
        </div>

        <DialogFooter className="flex justify-end">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-xs px-4 py-2"
            size="sm"
          >
            I Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TermsDialog;

