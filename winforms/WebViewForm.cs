using System;
using System.Windows.Forms;
using Microsoft.Web.WebView2.WinForms;

namespace DraftTool.WinForms
{
    public partial class WebViewForm : Form
    {
        private WebView2 webView;
        private string url;

        public WebViewForm(string url)
        {
            this.url = url;
            InitializeComponent();
            Load += WebViewForm_Load;
        }

        private void InitializeComponent()
        {
            this.webView = new WebView2();

            this.SuspendLayout();

            // webView
            this.webView.Dock = DockStyle.Fill;
            this.webView.Name = "webView";
            this.webView.TabIndex = 0;

            // WebViewForm
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(1200, 800);
            this.Controls.Add(this.webView);
            this.Name = "WebViewForm";
            this.Text = "Draft Tool - Справочники";
            this.WindowState = FormWindowState.Maximized;
            this.ResumeLayout(false);
        }

        private async void WebViewForm_Load(object sender, EventArgs e)
        {
            try
            {
                // Инициализация WebView2
                await webView.EnsureCoreWebView2Async();
                
                // Загрузка URL
                webView.Navigate(url);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Ошибка загрузки интерфейса: {ex.Message}", 
                    "Ошибка", 
                    MessageBoxButtons.OK, 
                    MessageBoxIcon.Error);
            }
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            // Закрытие приложения при закрытии WebView
            Application.Exit();
            base.OnFormClosing(e);
        }
    }
}

