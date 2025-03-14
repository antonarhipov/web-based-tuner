# Made with JetBrains Junie

## Prompt 1

"I want to create a web based tuner application with nice visual effects. suggest step by step execution plan for this project. write the plan to docs/plan.md file"

## Prompt 2

Create a task list to implement this this plan. write task list to docs/tasks.md file

## Prompt 3

Start implementing the application. Follow the task list and mark the tasks as done [x] upone completion

---------

**The result is this repository :)**

# Web-Based Tuner Application

A web-based musical instrument tuner application with engaging visual effects.

## Description

This application allows musicians to tune their instruments using their device's microphone. It provides real-time pitch detection, note recognition, and visual feedback to help achieve accurate tuning.

![](img/tuner.png)


## Features

- Real-time pitch detection
- Note recognition with cents deviation
- Visual tuning feedback
- Support for various instruments
- Responsive design for desktop and mobile devices
- Engaging visual effects that respond to audio input

## Getting Started

### Prerequisites

- Modern web browser with microphone access
- Node.js and npm (for development)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/tuner.git
   cd tuner
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Start the development server
   ```
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Development

This project is currently under development. See the [project plan](docs/plan.md) and [task list](docs/tasks.md) for details on the implementation roadmap.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Web Audio API
- Various pitch detection algorithms (Autocorrelation, YIN, FFT-based)