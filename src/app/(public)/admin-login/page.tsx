import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminLoginPage() {
  return (
    <div className="mx-auto grid max-w-5xl gap-6 py-6 md:py-10">
      <div className="space-y-4">
        <Badge variant="neutral" className="w-fit">
          Staff / Admin Access
        </Badge>
        <h1 className="text-3xl font-semibold text-slate-900">No login required</h1>
        <p className="text-muted-foreground">
          VCare operations workspace is currently available in guest mode.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open operations dashboard</CardTitle>
          <CardDescription>Use staff/admin workflows directly.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href="/admin">
            <Button size="lg">Open staff dashboard</Button>
          </Link>
          <Link href="/patient">
            <Button size="lg" variant="outline">
              Open patient portal
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
