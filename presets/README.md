
# Auto-Layout Presets 📐
A `Preset` is an object that contains information for a screen size.  
An example `Preset` object:  
```
{
  "title" : "iPhone 7",
  "width" : 375,
  "height" : 667
}
``` 

A collection of presets is a json file. The file has a dictionary with 2 keys:  
1. `platforms` - An array of the platforms contained in the collection.  
2. `presets` - A dictionary with an array of presets for each item in `platforms`.
Example:  
```
{
  "platforms" : [
    "iOS",
    "Android"
  ],
  "presets" : {
    "iOS" : [
      {
        "title" : "iPhone 4S",
        "width" : 320,
        "height" : 480,
        "scale" : 2
      },
      {
        "title" : "iPhone 7",
        "width" : 375,
        "height" : 667,
        "scale" : 2
      }
    ],
    "Android" : [
      {
        "title" : "ldpi",
        "width" : 240,
        "height" : 400
      },
      {
        "title" : "mdpi",
        "width" : 320,
        "height" : 480
      }
    ]
  }
}
```

# Presets Editor 📝
You can edit a presets file using the `Presets Editor` or by editing the json file manually.

![](https://cl.ly/23072N1s1T1g/download/1-qllGDNJ9EGl-eKx5JJpe1A.png)

# Contribute 🎀

You can contribute presets in one of the following ways:

### GitHub Issue
1. Create an issue with your file: https://github.com/AnimaApp/Auto-Layout/issues 

### Pull Request
1. Fork this repo
2. Add your json file to the folder: https://github.com/AnimaApp/Auto-Layout/tree/master/presets/files
3. Add a metadata entry of your file to the index: https://github.com/AnimaApp/Auto-Layout/blob/master/presets/index.json
4. Create a Pull Request

### Email:
1. Email us your json file: presets@animaapp.com
