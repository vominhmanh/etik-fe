import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { User } from '@/types/auth';
import { useUser } from '@/hooks/use-user';

export function AccountInfo(): React.JSX.Element {
  const [user, setUser] = React.useState<User | null>(null);

  const { getUser } = useUser();

  React.useEffect(() => {
    const fetchUser = async () => {
      const fetchedUser = getUser();
      setUser(fetchedUser);
    };

    fetchUser();
  }, [getUser]);

  return (
    <Card>
      <CardContent>
        <Stack spacing={2} sx={{ alignItems: 'center' }}>
          <div>
            <Avatar sx={{ height: '80px', width: '80px' }}>{user?.email[0].toUpperCase()}</Avatar>
          </div>
          <Stack spacing={1} sx={{ textAlign: 'center' }}>
            <Typography variant="h5">{user?.fullName}</Typography>
          </Stack>
        </Stack>
      </CardContent>
      <Divider />
      <CardActions>
        <Button fullWidth variant="text">
          Upload picture
        </Button>
      </CardActions>
    </Card>
  );
}
