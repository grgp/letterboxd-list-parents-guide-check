## Letterboxd Parents Guide App

An app to check whether the films on your Letterboxd list are safe to watch in the living room.

<img width="832" alt="image" src="https://github.com/grgp/letterboxd-list-parents-guide-check/assets/12206156/4e8f5e86-7b37-444b-81bf-11f9474db582">

### Please run it on your local server only!

Currently this directly fetches both Letterboxd and IMDB data, it's neither scaleable or nice to be doing . 

## Guide
To modify the parameters, go to the src/app/constants.ts file.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
