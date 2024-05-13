using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using static System.Windows.Forms.VisualStyles.VisualStyleElement.Window;

namespace AwsFileSystem
{
    public partial class Home : Form
    {
        FolderBrowserDialog dialog = new FolderBrowserDialog();

        public Home()
        {
            InitializeComponent();
        }

        private void Form1_Load(object sender, EventArgs e)
        {
            LoadExplorer();
        }

        private void label1_Click(object sender, EventArgs e)
        {

        }

        private void textBox3_TextChanged(object sender, EventArgs e)
        {

        }

        private void groupBox1_Enter(object sender, EventArgs e)
        {

        }

        private void label6_Click(object sender, EventArgs e)
        {

        }

        public void LoadExplorer()
        {          
            if (dialog.ShowDialog() == DialogResult.OK)
            {
                localBrowser.Url = new Uri(dialog.SelectedPath);
                local_site_txtbox.Text = dialog.SelectedPath;
            }
        }

        private void localBrowser_LocationChanged(object sender, EventArgs e)
        {
            local_site_txtbox.Text = dialog.SelectedPath.ToString();
        }

        private void local_back_btn_Click(object sender, EventArgs e)
        {
            if (localBrowser.CanGoBack)
            {
                localBrowser.GoBack();
                local_site_txtbox.Text = dialog.SelectedPath;
            }
        }

        private void button2_Click(object sender, EventArgs e)
        {
            if (localBrowser.CanGoForward)
            {
                localBrowser.GoForward();
                local_site_txtbox.Text = dialog.SelectedPath;
            }
        }

        private void localBrowser_TabIndexChanged(object sender, EventArgs e)
        {
            local_site_txtbox.Text = dialog.SelectedPath.ToString();
        }
    }
}
