[![GitHub stars](https://img.shields.io/github/stars/AnimaApp/Auto-Layout.svg?style=social&label=Star)](https://github.com/AnimaApp/Auto-Layout/stargazers)

## 📐 Responsive Design for Sketch
![](https://cl.ly/1Q1l342E0j0b/ezgif.com-video-to-gif%20(6).gif)

Auto-Layout is a plugin for Sketch that enables designers to design fully responsive artboards.

### ☝️ Features

* 📍 Pins (Constraints) - [Learn more](https://animaapp.github.io/docs/v1/guide/03-pins.html)
* 🗄 Stacks (Flexbox) - [Learn more](https://animaapp.github.io/docs/v1/guide/12-stacks-flexbox.html)
* ⚡️ Updates in real time when dragging layers
* 🖥 Easily generate an overview of all screen sizes
* 💎 Supports Symbols
* 📱 Supports Web/iOS/Android
* ↔️ Breakpoints (media queries) (coming soon)

### 📺 Videos

* 📍 Pins [Watch](https://www.youtube.com/watch?v=v393LgriWCs)
* 🗄 Stacks (Flexbox) [Watch](https://www.youtube.com/watch?v=DiCXg17CwIY)

### 📝 Blog posts

* 📐 Auto-Layout [Read](https://medium.com/sketch-app-sources/introducing-auto-layout-for-sketch-24e7b5d068f9)
* 🗄 Stacks (Flexbox) [Read](https://medium.com/sketch-app-sources/auto-layout-introducing-stacks-flexbox-for-sketch-c8a11422c7b5#.dj57nqyh3)

# 📖 Documentation

* 🔗 [Link](https://animaapp.github.io/docs/v1/guide/)

## Pins

### Simple 

![](/docs/images/pins-simple.png)

Simple pinning allows to pin a layer to its parent with the following:

* Top
* Right
* Bottom
* Left
* Center Horizontally
* Center Vertically

When selecting a pin, Auto-Layout will set the pin constant value as the current pixel value.  

*For example if a layer is 20px from the right and you select `Pin to Right`, the `right` pin constant value will be set to 20px.*

Once a pin is set, Auto-Layout will enforce the pin value when the artboard is resized.  

*For example if you pinned a layer to the right by 20px, you can resize the artboard by dragging its right side and you'll notice the layer always stays 20px from the right.*

![](https://cl.ly/3h0m151x0N1R/download/Screen%20Recording%202017-01-29%20at%2002.22%20PM.gif)

### Pin to Parent

* A `Layer` is always pinned to its `Parent`
* A parent can be either an `Artboard` or a `Group`
* Pinning a `Layer` to a `Sibling` layer is currently **not** supported

`Layer` in an `Artboard`
![](/docs/images/pins1.png)

`Layer` in a `Group`
![](/docs/images/pins2.png)

### Advanced 

![](/docs/images/pins-advanced.png)

* To reveal the advanced pinning panel click `Pins`
* You can pin a layer either by `pixels` or by `percent`.
* `Pixels` values are in the left text boxes, `Percent` values are in the right text boxes.
* Use the `Toggle` button to select which type of pinning.

![](https://cl.ly/0x3m3L2Z4628/download/Screen%20Recording%202017-01-29%20at%2002.51%20PM.gif)

### Pinning by Pixels

![](/docs/images/pins3.png)

### Pinning by Percent

![](/docs/images/pins4.png)
 
