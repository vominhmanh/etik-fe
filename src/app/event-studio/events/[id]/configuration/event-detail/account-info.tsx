import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Download as DownloadIcon } from "@phosphor-icons/react/dist/ssr/Download";
import { Clock as ClockIcon } from "@phosphor-icons/react/dist/ssr/Clock";
import { MapPin as MapPinIcon } from "@phosphor-icons/react/dist/ssr/MapPin";
import { CardMedia } from "@mui/material";

const user = {
  name: 'Sofia Rivers',
  avatar: '/assets/avatar.png',
  jobTitle: 'Senior Developer',
  country: 'USA',
  city: 'Los Angeles',
  timezone: 'GTM-7',
} as const;

export function AccountInfo(): React.JSX.Element {
  return (
    <Card>
      <CardMedia
        sx={{ height: 140 }}
        image="https://mui.com/static/images/cards/contemplative-reptile.jpg"
        title="green iguana"
      />
      <CardContent>
        <Typography gutterBottom variant="h5" component="div">
          REFUND MEETING ĐÀ NẴNG
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Lizards are a widespread group of squamate reptiles, with over 6,000
          species, ranging across all continents except Antarctica
        </Typography>
        <Stack direction="column" spacing={2} sx={{ alignItems: 'left', mt: 2 }}>
          <Stack sx={{ alignItems: 'left' }} direction="row" spacing={1}>
            <ClockIcon fontSize="var(--icon-fontSize-sm)" />
            <Typography color="text.secondary" display="inline" variant="body2">
              17:30 20/10/2024
            </Typography>
          </Stack>
          <Stack sx={{ alignItems: 'left' }} direction="row" spacing={1}>
            <MapPinIcon fontSize="var(--icon-fontSize-sm)" />
            <Typography color="text.secondary" display="inline" variant="body2">
              Số 3, đường Châu Văn Liêm, quận Nam Từ Liêm, Hà Nội
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
      <Divider />
      <CardActions>
        <Button fullWidth variant="text">
          Thay đổi ảnh bìa
        </Button>
      </CardActions>
    </Card>

  );
}
