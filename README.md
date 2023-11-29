This repository holds the federated modules for Console's virtual assistant.
Thus it doesn't have any entry point to test it locally. You will have to run
the [landing page frontend](https://github.com/RedHatInsights/landing-page-frontend/) to test it.

## Getting started

1. `npm install`
2. `npm run start` or `BETA=true npm run start` if running on beta/preview.
3. Download [landing page frontend](https://github.com/RedHatInsights/landing-page-frontend/))
    1. Update [fec.config.js](https://github.com/RedHatInsights/landing-page-frontend/blob/master/fec.config.js) by adding the required routes as follows:

   ```javascript
   
   module.exports = {
     // ...

     routes: {
       '/apps/virtual-assistant/': { host: 'http://localhost:8003' },

       // Optional. If you want to run a local instance of Rasa add this entry
       '/api/virtual-assistant/v1': { host: 'http://localhost:5005' },
     }
   };
   ```

    2. Run the landing page frontend by following the instructions on their README.

4. You should be able to see it on the bottom right. To make changes to the position/alignment relative to the landing page, check out the
   [component](https://github.com/RedHatInsights/landing-page-frontend/blob/master/src/components/app-content-renderer/virtual-assistant.tsx)
   or the [scss file](https://github.com/RedHatInsights/landing-page-frontend/blob/master/src/components/app-content-renderer/virtual-assistant.scss)
   In the landing page code.

### Standalone mode

A standalone mode is provided to run virtual assistant frontend without the landing page.
This mode won't provide the exact position of the elements as in the landing page, but it can be easier to run.

You still need to complete once the `Initial etc/hosts setup` as detailed in the landing page repository.
After that, you can run `npm run start:standalone`.

If you want to run your backend locally, use `USE_LOCAL_RASA=1 npm run start:standalone`.

### Testing

`npm run verify` will run `npm run lint` (eslint) and `npm test` (Jest)
