import React from 'react';
import { Button, Container, createStyles, Link, makeStyles, Typography } from '@material-ui/core';
import { useHistory } from 'react-router-dom';

const useStyles = makeStyles((theme) => createStyles({
  container: {
    padding: theme.spacing(4),
  },
  text: {
    marginTop: theme.spacing(2),
  },
  backButton: {
    marginTop: theme.spacing(4),
  },
}));

const About: React.FunctionComponent = () => {
  const history = useHistory();
  const styles = useStyles();

  return (
    <React.Fragment>
      <Container maxWidth='md' className={styles.container}>
        <Typography variant='h3'>Demos: The Civic Life</Typography>
        <Typography variant='h6'>/ˈdɛmoʊs/. Noun. The common populace of a state or district, the people.</Typography>
        <Typography variant='body1' className={styles.text}>
          Copyright (c) 2021 Jirawut Thongraar
        </Typography>
        <Typography variant='body1' className={styles.text}>
          This project is a part of the World History course at Kamnoetvidya Science Academy. <br />
          This project is open source under the MIT license
          (repository: <Link color='inherit' underline='always'
                 href='https://github.com/Non-J/demos-game'>GitHub</Link>)
          and made possible by the generosity of other free and open source projects.
        </Typography>
        <Button
          variant='contained'
          color='primary'
          className={styles.backButton}
          fullWidth
          onClick={() => {
            history.goBack();
          }}
        >Back</Button>
      </Container>
    </React.Fragment>
  );
};

export default About;