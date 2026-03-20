import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-3xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Guest mode enabled</CardTitle>
          <CardDescription>
            Account creation is disabled for this build. You can use VCare without signing up.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href="/patient">
            <Button size="lg">Open patient portal</Button>
          </Link>
          <Link href="/admin">
            <Button size="lg" variant="outline">
              Open staff dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
