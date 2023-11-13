This repository holds the federated modules for Console's virtual assistant.
Thus it doesn't have any entry point to test it locally. You will have to run
the [landing page frontend](https://github.com/RedHatInsights/landing-page-frontend/) to test it.

## Getting started

1. `npm install`

2. `npm run start` or `BETA=true npm run start` if running on beta/preview.
   
3. Run the landing page frontend (instructions on the [project repository](https://github.com/RedHatInsights/landing-page-frontend/))

4. You should be able to see it on the bottom right. To make changes to the position/alignment relative to the landing page, check out the
   [component](https://github.com/RedHatInsights/landing-page-frontend/blob/master/src/components/app-content-renderer/virtual-assistant.tsx)
   or the [scss file](https://github.com/RedHatInsights/landing-page-frontend/blob/master/src/components/app-content-renderer/virtual-assistant.scss)
   In the landing page code.

## Running with local backend

Start the backend locally by running Rasa (`make run`) and Rasa actions (`make run-actions`). After that start the frontend with `USE_LOCAL_RASA` env set to anything other than an empty string:

```bash
USE_LOCAL_RASA=1 npm run start
```

### Testing

`npm run verify` will run `npm run lint` (eslint) and `npm test` (Jest)
