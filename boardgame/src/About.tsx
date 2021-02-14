import React from 'react';
import { Container, createStyles, Link, makeStyles, Typography } from '@material-ui/core';

const useStyles = makeStyles((theme) => createStyles({
  container: {
    padding: theme.spacing(4),
  },
  text: {
    marginTop: theme.spacing(2),
  },
}));

const About: React.FunctionComponent = () => {
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
          This project is a part of World History course at Kamnoetvidya Science Academy. <br />
          This project is open source under the MIT license.
          (Repository: <Link color='inherit' underline='always'
                             href='https://github.com/Non-J/demos-game'>GitHub</Link>) <br />
          This project is made possible by the generosity of other free and open source projects.
        </Typography>
      </Container>
    </React.Fragment>
  );
};

export default About;