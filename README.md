So a while ago, I found https://sterlingdemille.com/encrusted , a online Z-machine/emulator, with a neat twist: it mapped your journey for you. The author added some other things which are likely cool (like dictation), but I didn't use. At some point, I tried loading Hitchhiker's Guide to the Galaxy, and it crashed... to learn it didn't really implement a "complete" emulator. 

Now fast forward to today, where I need some Agentic Coding tests ... and figuring I'll burn a bunch of tokens (I'm at about $300 as of this release) I might as well make something I can share with the community for the cost. 

So... this project was born. While I have passing knowledge of Rust, the goal here was to not ever touch the code, and let my agents do it (I've used various LLMs as benchmarks against each other for various parts). We needed to do a bunch of things to make me warm and fuzzy, such as : 

- Update the code to a "modern" Rust toolchain
- Build an example of how to use the W/A output in a web page
- Add support for later versions of the Zcode interpreter (excluding V6, the graphical games like Zork 0, Arthur, etc)

Of course, since we are basically creating AI slop with numerous supply chain injection opportunities, I wanted to throw some security around it and get it to run in a container. In reality, the end output of a WASM target executable plus a tech-readable single .HTML file is pretty harmless (e.g. the HTML is auditable and WASM is a pretty locked down enclave). But... the container creation is there if you wanted to drop this into your own server via your orchestration of choice. No NPM needs like the original. 

I've changed a few things, like the ability to save and load from a local file, and the mapping interactions got broken (and fixed) a number of times when adding support for later Zmachine formats. To that effect, I added more test cases based on the "real" games - some of which will require files not part of the archive. 

Note that this project does NOT cover V6 games - the graphic ones - like zork Zero, Arthur, Journey, and Shogun. 

### How Do I Run This? 

See HOWTO.MD

### Where do I get the games ?

One nice thing Microsoft did when they bought most of these from Activision was to Open Source the Zork Trilogy: 

https://opensource.microsoft.com/blog/2025/11/20/preserving-code-that-shaped-generations-zork-i-ii-and-iii-go-open-source/

The rest of the games... [are out there](https://eblong.com/infocom/)

Manuals too: https://www.ifwiki.org/Infocom_games

I will likely be dead in the ground long before I play all of them end to end, just to make sure there isn't something missing... but I've started a list in GAMELIST.md of what I've played. 

### Notes
- Saves games in the Quetzal format


### License
MIT license retained from the original; covers my derivations as well. Enjoy. 
