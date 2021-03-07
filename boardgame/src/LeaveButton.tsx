import React from 'react';
import { Button, Dialog, DialogActions, DialogTitle } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import useClientState from './ClientState';

const LeaveButton: React.FunctionComponent = () => {
  const history = useHistory();
  const leaveRoom = useClientState(state => state.leaveRoom);
  const [buttonDisable, setButtonDisable] = React.useState<boolean>(false);
  const [open, setOpen] = React.useState<boolean>(false);
  const handleOpen = () => {
    setButtonDisable(false);
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <React.Fragment>
      <Button variant='contained' color='secondary' onClick={handleOpen}>Leave Room</Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Are you sure you want to leave this room?</DialogTitle>
        <DialogActions>
          <Button
            variant='contained'
            color='primary'
            fullWidth
            disabled={buttonDisable}
            onClick={handleClose}>
            No, stay.
          </Button>
          <Button
            variant='contained'
            color='secondary'
            fullWidth
            disabled={buttonDisable}
            onClick={
              () => {
                setButtonDisable(true);
                leaveRoom()
                  .then(() => {
                    setOpen(false);
                    setButtonDisable(false);
                    history.replace('/');
                  });
              }
            }>
            Yes, leave.
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
};

export default LeaveButton;