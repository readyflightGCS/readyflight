// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [
      starlight({
          title: 'ReadyFlight',
          social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/readyflightGCS/readyflight' }],
          sidebar: [
              {
                  label: 'ReadyFlight',
                  items: [
                      // Each item here is one entry in the navigation menu.
                      { label: 'Getting Started', slug: 'getting-started' },
                  ],
              }
          ],
		  customCss: [
        	'./src/styles/global.css',
            './src/styles/landing.css',
      	  ],
      }),
	],

  vite: {
    plugins: [tailwindcss()],
  },
});