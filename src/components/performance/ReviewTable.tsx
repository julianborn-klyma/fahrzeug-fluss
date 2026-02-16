import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

interface ReviewRow {
  monteur_id: string;
  monteur_name: string;
  reviewer_name?: string;
  review?: any;
}

interface ReviewTableProps {
  rows: ReviewRow[];
  onEdit: (monteurId: string, monteurName: string, review?: any) => void;
}

const fmt = (v: number | undefined) => {
  if (v === undefined || v === null) return '—';
  return v > 0 ? `+${v}` : String(v);
};

const ReviewTable: React.FC<ReviewTableProps> = ({ rows, onEdit }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead className="text-center">Geschw.</TableHead>
          <TableHead className="text-center">Qualität</TableHead>
          <TableHead className="text-center">Zuverl.</TableHead>
          <TableHead className="text-center">Team</TableHead>
          <TableHead className="text-center">Sauber.</TableHead>
          <TableHead className="text-center">Gesamt</TableHead>
          <TableHead className="text-center">Bonus</TableHead>
          <TableHead className="text-center">Status</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(row => (
          <TableRow key={row.monteur_id}>
            <TableCell>
              <div className="font-medium">{row.monteur_name}</div>
            </TableCell>
            <TableCell className="text-center">{fmt(row.review?.score_speed)}</TableCell>
            <TableCell className="text-center">{fmt(row.review?.score_quality)}</TableCell>
            <TableCell className="text-center">{fmt(row.review?.score_reliability)}</TableCell>
            <TableCell className="text-center">{fmt(row.review?.score_team)}</TableCell>
            <TableCell className="text-center">{fmt(row.review?.score_cleanliness)}</TableCell>
            <TableCell className="text-center font-semibold">
              {row.review ? row.review.total_score.toFixed(2) : '—'}
            </TableCell>
            <TableCell className="text-center">
              {row.review ? `${Number(row.review.monthly_bonus).toFixed(0)} €` : '—'}
            </TableCell>
            <TableCell className="text-center">
              {row.review ? (
                <Badge
                  variant={row.review.status === 'approved' ? 'default' : 'secondary'}
                  className="text-[10px]"
                >
                  {row.review.status === 'approved' ? 'Freigegeben' : 'Entwurf'}
                </Badge>
              ) : (
                <span className="text-muted-foreground text-[10px]">Offen</span>
              )}
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onEdit(row.monteur_id, row.monteur_name, row.review)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ReviewTable;
