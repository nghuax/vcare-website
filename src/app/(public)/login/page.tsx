import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-3xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>No login required</CardTitle>
          <CardDescription>
            VCare is currently configured for guest access. Open the workspace directly.
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
