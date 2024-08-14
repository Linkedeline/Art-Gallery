const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const app = express();
const port = 3333;
// Set this to the path of your artwork directory
const ARTWORK_DIR = '/run/media/linkydeline/extra/Pictures/project/art/';


async function getImageTree(directory) {
    const imageTree = {};
    
    async function scanDirectory(dir) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (let entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.relative(ARTWORK_DIR, fullPath);
            
            if (entry.isDirectory()) {
                await scanDirectory(fullPath);
            } else if (entry.isFile() && /\.(jpg|jpeg|png|gif)$/i.test(entry.name)) {
                const parentDir = path.dirname(relativePath);
                if (!imageTree[parentDir]) {
                    imageTree[parentDir] = [];
                }
                imageTree[parentDir].push(entry.name);
            }
        }
    }
    
    await scanDirectory(directory);
    return imageTree;
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

var chosenPath;
// index page
app.get('/', function(req, res) {
  res.render('pages/index');
});

app.get('/contact', function (req,res) {
  res.render("pages/contact");
  
});

app.get('/art', async (req, res) => {
  try {
    chosenPath = ARTWORK_DIR;
    artworkStructure = await getImageTree(chosenPath);

    res.render('pages/art_index', { directories: Object.keys(artworkStructure) });
     
  } catch (error) {
     console.error('Error getting artwork structure:', error);
     res.status(500).send('Internal server error');
  }
});

const NSFW_ART="/run/media/linkydeline/extra/Pictures/project/nsfw/"
app.get('/nsfw', async (req, res) => {
  try {
    chosenPath = NSFW_ART;
    artworkStructure = await getImageTree(chosenPath);
    res.render('pages/art_index', { directories: Object.keys(artworkStructure) });
    
     
  } catch (error) {
     console.error('Error getting artwork structure:', error);
     res.status(500).send('Internal server error');
  }
});


app.get('/gallery/:directory', async (req, res) => {
    try {
        
        const directory = req.params.directory;
        if (artworkStructure[directory]) {
            const images = Array.isArray(artworkStructure[directory]) 
                ? artworkStructure[directory] 
                : Object.keys(artworkStructure[directory]);
            res.render('pages/gallery', { 
                directory: directory.replace('../nsfw',''), 
                images: images 
            });
        } else {
            res.status(404).send('Directory not found');
        }
    } catch (error) {
        console.error('Error getting artwork:', error);
        res.status(500).send('Internal server error');
    }
});

app.get('/api/artwork-structure', async (req, res) => {
    try {
        console.log(artworkStructure)
        res.json(artworkStructure);
    } catch (error) {
        console.error('Error getting artwork structure:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.get('/api/artwork/*', (req, res) => {

    console.log(chosenPath)
    const imagePath = path.join(chosenPath, req.params[0]);
    console.log(imagePath)
    res.sendFile(imagePath, (err) => {
        if (err) {
            console.error('Error sending file:', err);
            res.status(404).send('Image not found');
        }
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
